
import { FaLocationDot } from "react-icons/fa6";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from "@heroui/react";
import { CITIES } from "../lib/constants";

export default function LocationPicker({ location, setLocation }) {
	return (
		<Dropdown className="dark text-foreground bg-gray-800 border-gray-500" backdrop="blur">
			<DropdownTrigger>
				<Button variant="bordered" className="px-2 rounded-full min-w-fit min-h-fit">
					<FaLocationDot color="white" size={20} />
				</Button>
			</DropdownTrigger>

			<DropdownMenu
				aria-label="Choose city"
				className="max-h-64 overflow-y-auto"
			>
				{CITIES.map((city) => (
					<DropdownItem
						key={city.city}
						onClick={() => setLocation(city)}
						className={location['city'] === city.city ? "bg-gray-700" : ""}
					>
						{city.city}
					</DropdownItem>
				))}
			</DropdownMenu>
		</Dropdown>
	);
}
